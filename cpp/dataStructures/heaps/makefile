IDIR = ../../include
LDIR = ../../lib
LIB = ${LDIR}/lib-ds.a
CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 -Wall -I ${IDIR}

OFILES = Dheap.o LheapSet.o LlheapSet.o FheapSet.o 

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

Dheap.o : ${IDIR}/stdinc.h ${IDIR}/Dheap.h
DheapSet.o : ${IDIR}/stdinc.h ${IDIR}/DheapSet.h
LheapSet.o : ${IDIR}/stdinc.h ${IDIR}/LheapSet.h
LlheapSet.o : ${IDIR}/stdinc.h ${IDIR}/LlheapSet.h
FheapSet.o : ${IDIR}/stdinc.h ${IDIR}/FheapSet.h

all :	${OFILES}
	ar -ru ${LIB} ${OFILES}

clean:
	rm -f *.o
	#make -C dvr clean
